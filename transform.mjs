import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function tryMkdir(dirpath) {
	try {
		return await fs.mkdir(dirpath);
	} catch (err) {
		if (err.code !== 'ENOENT' || err.code !== 'EEXIST') return;
	}
}

async function recursiveFindFiles(dirpath) {
	const files = [];

	for (const f of await fs.readdir(dirpath)) {
		const path = `${dirpath}/${f}`;
		const stat = await fs.stat(path);

		if (!stat.isDirectory()) {
			if (!path.endsWith('.ts')) continue;
			files.push(path);
			continue;
		}

		const results = await recursiveFindFiles(path);
		console.log(results);
		results.forEach(r => files.push(r));
	}

	return files.flat();
}

const allFiles = await recursiveFindFiles(path.resolve(__dirname, 'src', 'api'));
console.log(allFiles);
for (const file of allFiles) {
	try {
		const fullPath = path.resolve(file);
		const [filename] = fullPath.split('/').slice(-1);

		const source = await fs.readFile(fullPath, 'utf8');
		//const { code } = await transformAsync(source, { filename, ...transformOptions });
		const code = source.replace(/\.\.\/(\.\.)?.*/g, (match, cap1) => {
			let str = '../src' + match.slice(2);
			if (cap1) {
				console.log(str, cap1);
				let chunks = str.split('/');
				chunks.splice(2, 1);
				str = '../' + chunks.join('/');
			}
			return str;
		});

		// prettier-ignore
		const re = new RegExp('/mnt/c/Users/Trevor R/Developer/Journalism/teacher-madness/node_modules/', 'g');
		const cleaned = code.replace(re, '');

		const parentDir = path.dirname(fullPath.replace(/src\/api/i, 'api'));
		await tryMkdir(parentDir);
		const newPath = path.join(parentDir.replace(/src\/api/i, 'api'), filename);
		//const finalPath = newPath.substring(0, newPath.length - 2) + 'js';

		await fs.writeFile(newPath, cleaned, 'utf8').catch(err => console.log(`Error writing: ${err}`));

		console.log(`Transformed ${file} into ${newPath}`);
	} catch (err) {
		console.error(err.stack ?? err);
	}
}
