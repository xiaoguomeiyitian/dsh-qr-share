/**
 * dsh-qr-share dictionaries: zh-Hans + en. The shell's locale service
 * drives the active language; the footer action reads via `ctx.locale.bind`.
 */

export const LOCALE_NS = 'qr-share' as const

export interface QrShareKey {
  'button.label': string
  'button.tooltip': string
  'dialog.title': string
  'dialog.hint': string
  'dialog.urlLabel': string
  'dialog.close': string
  'dialog.error': string
}

export const zh: QrShareKey = {
  'button.label': '扫码登录',
  'button.tooltip': '用手机扫码以同一账号登录',
  'dialog.title': '用手机扫码登录',
  'dialog.hint':
    '用手机相机扫描下方二维码。手机打开后会自动以当前账号登录，token 与浏览器 cookie 同寿命。',
  'dialog.urlLabel': '链接',
  'dialog.close': '关闭',
  'dialog.error': '二维码生成失败',
}

export const en: QrShareKey = {
  'button.label': 'Mobile Login',
  'button.tooltip': 'Scan with a phone to log in to this session',
  'dialog.title': 'Scan to log in on mobile',
  'dialog.hint':
    'Scan the QR code below with your phone camera. The phone will log in to this session; the token lives as long as the browser cookie.',
  'dialog.urlLabel': 'URL',
  'dialog.close': 'Close',
  'dialog.error': 'Failed to render QR code',
}
