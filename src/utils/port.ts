import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function killPort(port: number): Promise<void> {
  try {
    // ポートを使用しているプロセスのPIDを取得（複数の方法で試す）
    const commands = [
      `lsof -i :${port} -sTCP:LISTEN -t`,
      `lsof -i :${port} -t`,
      `netstat -vanp tcp | grep ${port} | awk '{print $9}'`,
    ];

    let pids: string[] = [];
    for (const cmd of commands) {
      try {
        const { stdout } = await execAsync(cmd);
        const foundPids = stdout.trim().split("\n").filter(Boolean);
        if (foundPids.length > 0) {
          pids = foundPids;
          break;
        }
      } catch (error) {
        // コマンドが失敗しても次のコマンドを試す
        continue;
      }
    }

    if (pids.length > 0) {
      // すべてのプロセスを一度に終了
      await execAsync(`kill -9 ${pids.join(" ")}`);
      // 念のため少し待つ
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    // エラーは無視（プロセスが存在しない場合など）
  }
}
