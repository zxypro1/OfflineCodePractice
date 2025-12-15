import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 优先使用 Electron 主进程注入的 APP_ROOT，保证打包后路径正确
    const appRoot = process.env.APP_ROOT || process.cwd();
    console.log('appRoot', appRoot);
    const problemsPath = path.join(appRoot, 'public', 'problems.json');
    console.log('problemsPath', problemsPath);
    const problemsData = fs.readFileSync(problemsPath, 'utf8');
    console.log('problemsData', problemsData);
    const problems = JSON.parse(problemsData);
    console.log('problems', problems);
    res.status(200).json(problems);
  } catch (error) {
    console.error('Error reading problems.json:', error);
    res.status(500).json({ error: 'Failed to load problems: ' + (error as Error).message });
  }
}
