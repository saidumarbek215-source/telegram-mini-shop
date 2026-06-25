import FaqAccordion from '../components/FaqAccordion.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { t } from '../i18n.js'

function getFaqItems(lang) {
  return [
    { q: t('faqQ1', lang), a: t('faqA1', lang) },
    { q: t('faqQ2', lang), a: t('faqA2', lang) },
    { q: t('faqQ3', lang), a: t('faqA3', lang) },
    { q: t('faqQ4', lang), a: t('faqA4', lang) },
    { q: t('faqQ5', lang), a: t('faqA5', lang) },
    { q: t('faqQ6', lang), a: t('faqA6', lang) },
  ]
}

export default function Faq() {
  const { lang } = useShop()

  return (
    <div className="px-4">
      <header className="pb-3 pt-5">
        <h1 className="text-lg font-bold">{t('help', lang)}</h1>
        <p className="mt-1 text-sm text-muted">{t('faqSubtitle', lang)}</p>
      </header>

      <FaqAccordion items={getFaqItems(lang)} />
    </div>
  )
}
