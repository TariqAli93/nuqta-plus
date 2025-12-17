import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { machineIdSync } from 'node-machine-id';
import { webcrypto } from 'crypto'; // WebCrypto built-in in Node
import { TextEncoder } from 'util';

const { subtle } = webcrypto;
const encoder = new TextEncoder();

// -----------------------------
// مسارات التخزين في userData
// -----------------------------
const userDataPath = app.getPath('userData');
const licensePath = path.join(userDataPath, 'license.dat');
const machineIdPath = path.join(userDataPath, 'machine.id');

// 🔐 المفتاح العام بصيغة Base64 (SPKI) — بدون BEGIN/END
// مهم: يفضّل يكون سطر واحد أو نخلي الأسطر، بس راح نحذف الفراغات قبل فك التشفير
const PUBLIC_KEY_BASE64 = `
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuK2qXTnzOh1DIaLO9fRcyjsp8uES+T7ZGJJAPo8iw9Krxu5KOJbrtyfhwl3QiUj7cobNOdHUAqGU0dOk7sVo89dA5Gf5zMreHOAU2gtP25L9It2jyMyC+E7rwnDGGAMlk9G2NOxHCmqsh5FIxvdT3Ulq4fjresP2zhxWI3F8POXb2IQI6BLLGi51j+epny8BXwm5y1UFX3ivUOizOhPOyp2bqR0pm6WfCtbuLCEwxSBJj53wiO/WjXKnXGDH3+427vY0R+kAMvRs1iljIBkf7AYXPiSCPUYkFST987HHQfRS28lbkCsiEWHKZqn/9iPeMsRGN4Ym2uJB+yHW0PztsQIDAQAB
`.replace(/\s+/g, ''); // إزالة المسافات والأسطر

// -----------------------------
// Helpers Base64 ↔ Uint8Array
// -----------------------------
function base64ToBytes(b64) {
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}

// -----------------------------
// Machine ID – ثابت للجهاز
// -----------------------------
export function getMachineId() {
  try {
    if (fs.existsSync(machineIdPath)) {
      return fs.readFileSync(machineIdPath, 'utf8').trim();
    }
  } catch (e) {
    // Silently handle read error
  }

  const id = machineIdSync(true);
  try {
    fs.writeFileSync(machineIdPath, id, 'utf8');
  } catch (e) {
    // Silently handle write error
  }
  return id.trim();
}

// -----------------------------
// تخزين وقراءة الرخصة من userData
// -----------------------------
export function saveLicenseString(str) {
  try {
    fs.writeFileSync(licensePath, str.trim(), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

function loadLicenseString() {
  try {
    if (!fs.existsSync(licensePath)) return null;
    return fs.readFileSync(licensePath, 'utf8').trim();
  } catch (e) {
    return null;
  }
}

// -----------------------------
// التحقق من التوقيع (WebCrypto في Node)
// -----------------------------
async function verifySignature(data, signatureBase64) {
  const dataBytes = encoder.encode(JSON.stringify(data));
  const signatureBytes = base64ToBytes(signatureBase64);

  // استيراد المفتاح العام من Base64 SPKI
  const keyData = base64ToBytes(PUBLIC_KEY_BASE64);

  let key;
  try {
    key = await subtle.importKey('spki', keyData, { name: 'RSA-PSS', hash: 'SHA-256' }, false, [
      'verify',
    ]);
  } catch (e) {
    return false;
  }

  try {
    const ok = await subtle.verify(
      { name: 'RSA-PSS', saltLength: 32 },
      key,
      signatureBytes,
      dataBytes
    );
    return ok;
  } catch (e) {
    return false;
  }
}

// -----------------------------
// Verify License – القلب الفعلي
// -----------------------------
export async function verifyLicense() {
  const licenseString = loadLicenseString();
  if (!licenseString) {
    return { ok: false, reason: 'no_license_file' };
  }

  let licenseObj;
  try {
    // بدل atob: نستخدم Buffer في Node
    const json = Buffer.from(licenseString, 'base64').toString('utf8');
    licenseObj = JSON.parse(json);
  } catch (e) {
    return { ok: false, reason: 'invalid_license_format' };
  }

  const { data, signature } = licenseObj || {};

  if (!data || !signature) {
    return { ok: false, reason: 'invalid_license_format' };
  }

  const currentId = getMachineId();

  // 1) التأكد من أن الرخصة لهذا الجهاز
  if (data.machineId !== currentId) {
    return { ok: false, reason: 'machine_mismatch' };
  }

  // 2) تاريخ الانتهاء
  const today = new Date().toISOString().slice(0, 10);
  if (data.exp && data.exp < today) {
    return { ok: false, reason: 'expired' };
  }

  // 3) التحقق من التوقيع
  const valid = await verifySignature(data, signature);
  if (!valid) {
    return { ok: false, reason: 'invalid_signature' };
  }

  // ✅ كل شيء سليم
  return { ok: true, data };
}
