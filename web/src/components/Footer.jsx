import { Link } from 'react-router-dom'

export default function Footer({ shop }) {
  return (
    <footer className="bg-primary text-white mt-16">
      <div className="container-web py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-accent font-bold text-lg mb-3">{shop?.store_name || "Do'kon"}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {shop?.store_description || "Sifatli mahsulotlar eng qulay narxlarda."}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Havolalar</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-accent transition-colors">Bosh sahifa</Link></li>
              <li><Link to="/catalog" className="hover:text-accent transition-colors">Katalog</Link></li>
              <li><Link to="/cart" className="hover:text-accent transition-colors">Savat</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Aloqa</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {shop?.bot_username && (
                <li>
                  <a
                    href={`https://t.me/${shop.bot_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} {shop?.store_name || "Do'kon"}. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  )
}
