export function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-form">
        <h1>התחברות</h1>
          <div className="form-group">
            <input type="email" id="email" autoComplete="off" required />
            <label htmlFor="email">אימייל</label>
          </div>
          <div className="form-group">
            <input type="password" id="password" />
            <label htmlFor="password">סיסמה</label>
          </div>
          <button className="btn" type="submit">התחבר</button>
      </div>
    </div>
  )
}