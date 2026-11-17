// Firebase プロジェクト・Firestore・Webアプリ設定を自動構築し、
// src/config/firebase.ts と wrangler.jsonc に書き込むスクリプト
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const run = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] });
const fb = `${process.env.HOME}/.local/bin/firebase`;

function main() {
  const args = process.argv.slice(2);
  let projectId = args[0] || '';

  if (!projectId) {
    const listJson = JSON.parse(run(`${fb} projects:list --json`));
    const projects = listJson.result || [];
    const existing = projects.find((p) => p.projectId.startsWith('fordays-guests'));
    if (existing) {
      projectId = existing.projectId;
      console.log(`既存のプロジェクトを使用します: ${projectId}`);
    } else {
      projectId = `fordays-guests-${Math.random().toString(36).slice(2, 7)}`;
      console.log(`新しい Firebase プロジェクトを作成します: ${projectId}`);
      run(`${fb} projects:create ${projectId} --display-name "FORDAYS Guests"`);
    }
  }

  run(`${fb} use ${projectId} --add --alias default`);

  // Firestore DB の確認・作成
  try {
    const dbs = JSON.parse(run(`${fb} firestore:databases:list --project ${projectId} --json`)).result || [];
    if (dbs.length === 0) {
      console.log('Firestore データベース (asia-northeast1) を作成します...');
      run(`${fb} firestore:databases:create "(default)" --location="asia-northeast1" --project ${projectId}`);
    }
  } catch (e) {
    console.log('Firestore 作成スキップまたは作成済み:', e.message?.split('\n')[0]);
  }

  // Web アプリの確認・作成
  const apps = JSON.parse(run(`${fb} apps:list WEB --project ${projectId} --json`)).result || [];
  let appId = apps[0]?.appId;
  if (!appId) {
    console.log('Firebase Web アプリを作成します...');
    const created = JSON.parse(run(`${fb} apps:create WEB "fordays-guests-web" --project ${projectId} --json`)).result;
    appId = created.appId;
  }

  // SDK Config 取得
  const sdkRaw = JSON.parse(run(`${fb} apps:sdkconfig WEB ${appId} --project ${projectId} --json`)).result.sdkConfig;

  // src/config/firebase.ts を更新
  const tsContent = `// Firebase Web SDK 設定（Firebase CLI で自動取得済み）
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ${JSON.stringify(sdkRaw.apiKey)},
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ${JSON.stringify(sdkRaw.authDomain)},
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ${JSON.stringify(sdkRaw.projectId)},
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ${JSON.stringify(sdkRaw.storageBucket)},
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ${JSON.stringify(sdkRaw.messagingSenderId)},
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ${JSON.stringify(sdkRaw.appId)},
};

export const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);
`;
  writeFileSync('src/config/firebase.ts', tsContent);

  // wrangler.jsonc の vars にも登録（Cloudflare 側で手動登録不要にする）
  const wrangler = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
  wrangler.vars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: sdkRaw.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: sdkRaw.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: sdkRaw.projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: sdkRaw.storageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: sdkRaw.messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: sdkRaw.appId,
  };
  writeFileSync('wrangler.jsonc', JSON.stringify(wrangler, null, 2) + '\n');

  console.log('✓ Firebase の設定取得と wrangler.jsonc への登録が完了しました！');
}

main();
