import LoginContainer from '@/client/features/auth/LoginContainer';

export default function LoginPage() {
  return (
    <main className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow-sm" style={{ width: 380 }}>
        <div className="card-body p-4">
          <h1 className="h4 mb-4 text-center">Solicitações</h1>
          <LoginContainer />
          <p className="text-muted small mt-4 mb-0">
            POC — usuários: <code>admin</code>, <code>maria</code>, <code>joao</code> (senha <code>123456</code>)
          </p>
        </div>
      </div>
    </main>
  );
}
