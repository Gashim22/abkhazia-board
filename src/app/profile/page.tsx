export default function ProfilePage() {
  return (
    <div style={{ padding: '60px 16px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>👤</div>
      <h1 style={{
        fontFamily:   'var(--font-montserrat), sans-serif',
        fontWeight:   800,
        fontSize:     '26px',
        color:        'var(--text-primary)',
        marginBottom: '10px',
      }}>
        Личный кабинет
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6 }}>
        Раздел в разработке — будет готов на следующем этапе.
        <br />Здесь появятся ваши объявления, настройки профиля и история.
      </p>
      <a href="/" style={{
        display:      'inline-block',
        marginTop:    '28px',
        padding:      '10px 24px',
        background:   'var(--accent)',
        color:        '#fff',
        borderRadius: '10px',
        fontWeight:   600,
        fontSize:     '14px',
        textDecoration: 'none',
      }}>
        ← На главную
      </a>
    </div>
  )
}
