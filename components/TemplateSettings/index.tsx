'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import ReplyTemplates from '../ReplyTemplates'
import './TemplateSettings.scss'

const TemplateSettings = () => {
  const { t } = useLocale()
  return (
    <div className="TemplateSettings">
      <div className="heading">
        <p className="eyebrow">{t('Write it once. Make it yours.')}</p>
        <h1>{t('Good words, on hand.')}</h1>
        <p>
          {t(
            'Create and refine the replies you use most. Your saved templates are available whenever you compose a message.',
          )}
        </p>
      </div>
      <ReplyTemplates mode="manage" />
    </div>
  )
}

export default TemplateSettings
