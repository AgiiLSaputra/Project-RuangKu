import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BookingProvider } from './context/BookingContext'
import { ModalAkunNonaktif } from './components/domain/auth/ModalAkunNonaktif'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <BrowserRouter>
      {/* Tangkap galat render apa pun di seluruh aplikasi supaya tidak pernah
          jadi layar putih polos (CATATAN_BUG.md — bug #3). */}
      <ErrorBoundary>
        <AuthProvider>
          <BookingProvider>
            <AppRoutes />
            {/* Popup "Log Out / Ajukan Banding" saat akun dinonaktifkan di tengah sesi (FR-H1). */}
            <ModalAkunNonaktif />
          </BookingProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
