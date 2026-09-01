/**
 * dsh-qr-share dictionaries. The DSH shell ships `zh` + `en` as built-in
 * locales and falls back through its language chain; additional
 * dictionaries below (`zh-Hant`, `ja`, `ko`, `fr`, `de`, `ru`) register
 * through the single-locale overload and activate whenever a language
 * pack sets that preference. Unregistered locales still fall back to
 * the built-in chain (`zh`/`en`).
 */

export const LOCALE_NS = 'qr-share' as const

export interface QrShareKey {
  'button.label': string
  'button.tooltip': string
  'dialog.title': string
  'dialog.hint': string
  'dialog.urlLabel': string
  'dialog.copy': string
  'dialog.copied': string
  'dialog.copyFailed': string
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
  'dialog.copy': '复制链接',
  'dialog.copied': '已复制',
  'dialog.copyFailed': '复制失败',
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
  'dialog.copy': 'Copy link',
  'dialog.copied': 'Copied',
  'dialog.copyFailed': 'Copy failed',
  'dialog.close': 'Close',
  'dialog.error': 'Failed to render QR code',
}

/**
 * Extra dictionaries for non-built-in locales. These ride the
 * single-locale registration overload; a matching locale only activates
 * when a language-pack plugin sets the preference.
 */
export const extraDicts: Record<string, QrShareKey> = {
  'zh-Hant': {
    'button.label': '分享',
    'button.tooltip': '掃碼將目前工作階段分享到手機',
    'dialog.title': '掃碼分享',
    'dialog.hint':
      '用手機相機掃描下方 QR Code。手機開啟後會自動以目前帳號登入，token 與瀏覽器 cookie 同壽命。',
    'dialog.urlLabel': '連結',
    'dialog.copy': '複製連結',
    'dialog.copied': '已複製',
    'dialog.copyFailed': '複製失敗',
    'dialog.close': '關閉',
    'dialog.error': 'QR Code 產生失敗',
  },
  ja: {
    'button.label': '共有',
    'button.tooltip': 'スキャンしてこのセッションをスマホに共有',
    'dialog.title': 'スキャンして共有',
    'dialog.hint':
      'スマホのカメラで下のQRコードを読み取ってください。そのセッションに自動でログインし、トークンの有効期限はブラウザのCookieと同じです。',
    'dialog.urlLabel': 'リンク',
    'dialog.copy': 'リンクをコピー',
    'dialog.copied': 'コピーしました',
    'dialog.copyFailed': 'コピーに失敗しました',
    'dialog.close': '閉じる',
    'dialog.error': 'QRコードの生成に失敗しました',
  },
  ko: {
    'button.label': '공유',
    'button.tooltip': '스캔하여 현재 세션을 휴대폰으로 공유',
    'dialog.title': '스캔하여 공유',
    'dialog.hint':
      '휴대폰 카메라로 아래 QR 코드를 스캔하세요. 휴대폰이 이 세션에 자동으로 로그인되며, 토큰은 브라우저 쿠키와 같은 수명을 가집니다.',
    'dialog.urlLabel': '링크',
    'dialog.copy': '링크 복사',
    'dialog.copied': '복사됨',
    'dialog.copyFailed': '복사 실패',
    'dialog.close': '닫기',
    'dialog.error': 'QR 코드 생성 실패',
  },
  fr: {
    'button.label': 'Partager',
    'button.tooltip': 'Scannez pour partager cette session avec votre téléphone',
    'dialog.title': 'Scanner pour partager',
    'dialog.hint':
      "Scannez le QR code ci-dessous avec l'appareil photo de votre téléphone. Le téléphone se connectera à cette session ; le jeton a la même durée de vie que le cookie du navigateur.",
    'dialog.urlLabel': 'Lien',
    'dialog.copy': 'Copier le lien',
    'dialog.copied': 'Copié',
    'dialog.copyFailed': 'Échec de la copie',
    'dialog.close': 'Fermer',
    'dialog.error': 'Échec de la génération du QR code',
  },
  de: {
    'button.label': 'Teilen',
    'button.tooltip': 'Scannen, um diese Sitzung mit dem Telefon zu teilen',
    'dialog.title': 'Scannen zum Teilen',
    'dialog.hint':
      'Scannen Sie den untenstehenden QR-Code mit der Kamera Ihres Telefons. Das Telefon meldet sich an dieser Sitzung an; das Token lebt so lange wie das Browser-Cookie.',
    'dialog.urlLabel': 'Link',
    'dialog.copy': 'Link kopieren',
    'dialog.copied': 'Kopiert',
    'dialog.copyFailed': 'Kopieren fehlgeschlagen',
    'dialog.close': 'Schließen',
    'dialog.error': 'QR-Code konnte nicht erstellt werden',
  },
  ru: {
    'button.label': 'Поделиться',
    'button.tooltip': 'Отсканируйте, чтобы поделиться этой сессией с телефоном',
    'dialog.title': 'Отсканируйте для доступа',
    'dialog.hint':
      'Отсканируйте QR-код ниже камерой телефона. Телефон войдёт в эту сессию; токен живёт столько же, сколько cookie браузера.',
    'dialog.urlLabel': 'Ссылка',
    'dialog.copy': 'Копировать ссылку',
    'dialog.copied': 'Скопировано',
    'dialog.copyFailed': 'Не удалось скопировать',
    'dialog.close': 'Закрыть',
    'dialog.error': 'Не удалось создать QR-код',
  },
}
