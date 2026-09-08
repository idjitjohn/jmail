import ReplyTemplates from '../ReplyTemplates'
import './TemplateSettings.scss'

const TemplateSettings = () => (
  <div className="TemplateSettings">
    <div className="heading">
      <p className="eyebrow">Write it once. Make it yours.</p>
      <h1>Good words, on hand.</h1>
      <p>
        Create and refine the replies you use most. Your saved templates are
        available whenever you compose a message.
      </p>
    </div>
    <ReplyTemplates mode="manage" />
  </div>
)

export default TemplateSettings
