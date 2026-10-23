import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BookingProvider } from './context/BookingContext'
import { ModalAkunNonaktif } from './components/domain/auth/ModalAkunNonaktif'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <AppRoutes />
          {/* Popup "Log Out / Ajukan Banding" saat akun dinonaktifkan di tengah sesi (FR-H1). */}
          <ModalAkunNonaktif />
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
