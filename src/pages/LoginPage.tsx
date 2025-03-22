import { MdEmail, MdLock } from 'react-icons/md';

export function LoginPage() {
  return (
    <div className='login-page'>
      <div className='login-form'>
        <h1>התחברות</h1>
        {/* <p className="subtitle">ברוך הבא, אנא התחבר</p> */}

        <form className='form-section'>
          <div className='form-group form-floating glass'>
            <div className='input-icon-wrapper'>
              <input
                type='email'
                id='email'
                placeholder='מייל'
                autoComplete='off'
                required
              />
              <MdEmail className='icon' />
              <label htmlFor='email'>מייל</label>
            </div>
          </div>

          <div className='form-group form-floating glass'>
            <div className='input-icon-wrapper'>
              <input
                type='password'
                id='password'
                placeholder='סיסמה'
                required
              />
              <MdLock className='icon' />
              <label htmlFor='password'>סיסמה</label>
            </div>
          </div>

          <button className='btn' type='submit'>
            התחבר
          </button>

          <div className='forgot-password'>
            <p>שכחת סיסמה?</p>
            <a href='#'>לחץ כאן</a>
          </div>
        </form>
      </div>
    </div>
  );
}
