import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 优先使用 Electron 主进程注入的 APP_ROOT，保证打包后路径正确
    const appRoot = process.env.APP_ROOT || process.cwd();
    const problemsPath = path.join(appRoot, 'public', 'problems.json');
    const problemsData = fs.readFileSync(problemsPath, 'utf8');
    const problems = JSON.parse(problemsData);
    
    res.status(200).json(problems);
  } catch (error) {
    console.error('Error reading problems.json:', error);
    res.status(500).json({ error: 'Failed to load problems' });
  }
}
