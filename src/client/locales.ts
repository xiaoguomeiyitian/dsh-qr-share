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
  'button.label': '分享',
  'button.tooltip': '扫码把当前会话分享到手机',
  'dialog.title': '扫码分享',
  'dialog.hint':
    '用手机相机扫描下方二维码。手机打开后会自动以当前账号登录，token 与浏览器 cookie 同寿命。',
  'dialog.urlLabel': '链接',
  'dialog.close': '关闭',
  'dialog.error': '二维码生成失败',
}

export const en: QrShareKey = {
  'button.label': 'Share',
  'button.tooltip': 'Scan to share this session with your phone',
  'dialog.title': 'Scan to share',
  'dialog.hint':
    'Scan the QR code below with your phone camera. The phone will log in to this session; the token lives as long as the browser cookie.',
  'dialog.urlLabel': 'URL',
  'dialog.close': 'Close',
  'dialog.error': 'Failed to render QR code',
}
