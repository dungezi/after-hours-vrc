import { execFileSync } from 'node:child_process';
import { readFileSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const problems=[];
const blocked=/(^|\/)(\.night-browser|\.qa|\.publish|\.agents|\.codex|node_modules|\.env(?:\..*)?)(\/|$)|(?:\.log|\.pem|\.key|\.p12|\.pfx|\.zip)$|(?:存档|日记)\.(?:json|txt)$|^[^/]+\.(?:png|jpe?g)$/i;
const patterns=[
  ['personal home path',/(?:[A-Z]:[\\/]Users[\\/][^\s'"`<>]+|\/(?:Users|home)\/[^\s/'"`<>]+|D:[\\/](?:GitProject|nodejs))/i],
  ['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['access token',/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{32,})/],
  ['credential in URL',/https?:\/\/[^\s/]+:[^\s/@]+@/],
  ['personal email',/[A-Z0-9._%+-]+@(?!users\.noreply\.github\.com\b|example\.(?:com|org|net)\b)[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ['phone number',/(?<!\d)1[3-9]\d{9}(?!\d)/],
];
for(const file of files){
  if(blocked.test(file)){problems.push(`${file}: local/private artifact`);continue;}
  const full=path.join(root,file);if(lstatSync(full).isSymbolicLink()){problems.push(`${file}: symbolic link`);continue;}
  if(!/\.(?:js|mjs|json|html|css|md|cmd|ya?ml)$/.test(file) && !path.basename(file).startsWith('.git'))continue;
  const text=readFileSync(full,'utf8');
  for(const [label,pattern] of patterns)if(pattern.test(text))problems.push(`${file}: ${label}`);
}
if(!files.length)problems.push('No tracked files to inspect.');
if(problems.length){console.error(problems.join('\n'));process.exitCode=1;}
else console.log(`Publication check passed: ${files.length} tracked files; no local profiles, saves, private paths or detected credentials.`);
