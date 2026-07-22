import { Link } from 'react-router-dom'

export default function Success() {
  return (
    <div className="container-web py-20 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Buyurtma qabul qilindi!</h1>
      <p className="text-gray-500 mb-8">Tez orada siz bilan bog'lanamiz.</p>
      <Link to="/" className="btn-primary inline-block">Bosh sahifaga qaytish</Link>
    </div>
  )
}
