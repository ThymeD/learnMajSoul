#!/usr/bin/env node
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const DEFAULT_OUTPUT_FILE = 'chinese-texts-report.json';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.hg',
  '.svn',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.cache',
  '.idea',
  '.vscode',
  'tmp',
  'temp',
  '.turbo',
  '.vercel',
  '.output',
]);

const IGNORED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.ico',
  '.svgz',
  '.pdf',
  '.zip',
  '.gz',
  '.7z',
  '.rar',
  '.tar',
  '.tgz',
  '.mp3',
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.class',
  '.jar',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.pyc',
  '.pyo',
]);

const HAS_CHINESE_REGEX = /[\p{Script=Han}]/u;
const CHINESE_TEXT_REGEX =
  /[\p{Script=Han}][\p{Script=Han}A-Za-z0-9，。！？；：、,.!?:;"'“”‘’（）()《》〈〉【】「」『』—…·\-_/+%％￥¥#@&~ \t\u00A0]*/gu;
const HORIZONTAL_SPACES_REGEX = /[ \t\u00A0]+/g;

async function main() {
  try {
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
      printHelp();
      return;
    }

    if (args.length > 2) {
      throw new Error('Too many arguments. Use --help to see usage.');
    }

    const scanRoot = args[0] ? path.resolve(args[0]) : process.cwd();
    const outputPath = args[1]
      ? path.resolve(args[1])
      : path.resolve(process.cwd(), DEFAULT_OUTPUT_FILE);

    await ensureDirectory(scanRoot);

    const scanStats = {
      directoriesVisited: 0,
      candidateFiles: 0,
      filesScanned: 0,
      filesWithChinese: 0,
      skippedByRule: 0,
      skippedLarge: 0,
      skippedBinary: 0,
      readErrors: 0,
      traversalErrors: 0,
      totalOccurrences: 0,
    };

    const files = await collectFiles(scanRoot, outputPath, scanStats);
    const counts = new Map();

    for (const filePath of files) {
      await scanFile(filePath, counts, scanStats);
    }

    const texts = Array.from(counts.entries())
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.text.localeCompare(b.text);
      });

    const report = {
      schemaVersion: '1.0',
      generatedAt: new Date().toISOString(),
      scanRoot,
      summary: {
        uniqueTextCount: texts.length,
        totalOccurrences: scanStats.totalOccurrences,
        directoriesVisited: scanStats.directoriesVisited,
        candidateFiles: scanStats.candidateFiles,
        filesScanned: scanStats.filesScanned,
        filesWithChinese: scanStats.filesWithChinese,
        skippedByRule: scanStats.skippedByRule,
        skippedLarge: scanStats.skippedLarge,
        skippedBinary: scanStats.skippedBinary,
        readErrors: scanStats.readErrors,
        traversalErrors: scanStats.traversalErrors,
      },
      texts,
    };

    await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    console.log(`Scan completed.`);
    console.log(`Root: ${scanRoot}`);
    console.log(`Unique Chinese texts: ${report.summary.uniqueTextCount}`);
    console.log(`Total occurrences: ${report.summary.totalOccurrences}`);
    console.log(`Output file: ${outputPath}`);
  } catch (error) {
    console.error('Scan failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

function printHelp() {
  console.log(`
Usage:
  node extract-chinese-texts.js [scanRoot] [outputFile]

Arguments:
  scanRoot    Optional. Directory to scan recursively. Default: current directory.
  outputFile  Optional. Output JSON file path. Default: ./chinese-texts-report.json

Output format:
  {
    "texts": [
      { "text": "...", "count": 12 }
    ]
  }
`);
}

async function ensureDirectory(directoryPath) {
  let stat;
  try {
    stat = await fs.stat(directoryPath);
  } catch (error) {
    throw new Error(`Cannot access scan directory: ${directoryPath}`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`scanRoot is not a directory: ${directoryPath}`);
  }
}

async function collectFiles(scanRoot, outputPath, scanStats) {
  const files = [];
  const stack = [scanRoot];
  const outputRealPath = path.resolve(outputPath);

  while (stack.length > 0) {
    const currentDir = stack.pop();
    if (!currentDir) {
      continue;
    }

    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
      scanStats.directoriesVisited += 1;
    } catch (error) {
      scanStats.traversalErrors += 1;
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);

      if (entryPath === outputRealPath) {
        scanStats.skippedByRule += 1;
        continue;
      }

      if (entry.isSymbolicLink()) {
        scanStats.skippedByRule += 1;
        continue;
      }

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          scanStats.skippedByRule += 1;
          continue;
        }
        stack.push(entryPath);
        continue;
      }

      if (!entry.isFile()) {
        scanStats.skippedByRule += 1;
        continue;
      }

      if (shouldSkipFile(entry.name)) {
        scanStats.skippedByRule += 1;
        continue;
      }

      scanStats.candidateFiles += 1;
      files.push(entryPath);
    }
  }

  return files;
}

function shouldSkipFile(fileName) {
  const lowerName = fileName.toLowerCase();
  const ext = path.extname(lowerName);
  return IGNORED_EXTENSIONS.has(ext);
}

async function scanFile(filePath, counts, scanStats) {
  try {
    const stat = await fs.stat(filePath);
    if (stat.size > MAX_FILE_SIZE_BYTES) {
      scanStats.skippedLarge += 1;
      return;
    }

    const buffer = await fs.readFile(filePath);
    if (isLikelyBinary(buffer)) {
      scanStats.skippedBinary += 1;
      return;
    }

    const content = buffer.toString('utf8');
    const matches = content.matchAll(CHINESE_TEXT_REGEX);
    let hasMatchInFile = false;

    for (const match of matches) {
      const normalized = normalizeText(match[0]);
      if (!normalized) {
        continue;
      }
      if (!HAS_CHINESE_REGEX.test(normalized)) {
        continue;
      }

      const existing = counts.get(normalized) || 0;
      counts.set(normalized, existing + 1);
      scanStats.totalOccurrences += 1;
      hasMatchInFile = true;
    }

    scanStats.filesScanned += 1;
    if (hasMatchInFile) {
      scanStats.filesWithChinese += 1;
    }
  } catch (error) {
    scanStats.readErrors += 1;
  }
}

function normalizeText(value) {
  let text = value.replace(HORIZONTAL_SPACES_REGEX, ' ').trim();

  text = text
    .replace(/^[`"'“”‘’]+/u, '')
    .replace(/[`"'“”‘’]+$/u, '')
    .trim();

  text = text
    .replace(/^[,.;:!?，。！？；：、]+/u, '')
    .replace(/[,.;:!?，。！？；：、]+$/u, '')
    .trim();

  return text;
}

function isLikelyBinary(buffer) {
  if (!buffer || buffer.length === 0) {
    return false;
  }

  const sampleSize = Math.min(buffer.length, 4096);
  let suspiciousCount = 0;

  for (let i = 0; i < sampleSize; i += 1) {
    const byte = buffer[i];
    if (byte === 0) {
      return true;
    }
    if ((byte < 7 || (byte > 14 && byte < 32)) && byte !== 9) {
      suspiciousCount += 1;
    }
  }

  return suspiciousCount / sampleSize > 0.3;
}

void main();
