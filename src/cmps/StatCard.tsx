import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  category: 'תלמידים' | 'מורים' | 'תזמורות' | 'חזרות' | 'נוכחות' 
  comparison?: {
    value: number
    text: string
  }
  additionalStats?: {
    label: string
    value: string | number
  }[]
  progress?: {
    value: number
    total?: number
  }
}

export function StatCard({
  title,
  value,
  icon: Icon,
  category,
  comparison,
  additionalStats,
  progress,
}: StatCardProps) {
  const isIncrease = comparison?.value >= 0

  const categoryClass = {
    'תלמידים': 'students',
    'מורים': 'teachers',
    'תזמורות': 'orchestras',
    'חזרות': 'rehearsals',
    'נוכחות': 'attendance'
  }[category]

  return (
    <div className="stat-card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <div className={`icon-container ${categoryClass}`}>
          <Icon className="card-icon" strokeWidth={2} />
        </div>
      </div>

      <div className="card-value">{value}</div>

      {comparison && (
        <div className="card-comparison">
          <div className={`percentage ${isIncrease ? 'increase' : 'decrease'}`}>
            {isIncrease ? (
              <TrendingUp className="trend-icon" strokeWidth={2} />
            ) : (
              <TrendingDown className="trend-icon" strokeWidth={2} />
            )}
            <span>{Math.abs(comparison.value)}%</span>
          </div>
          <span className="comparison-text">{comparison.text}</span>
        </div>
      )}

      {additionalStats && additionalStats.length > 0 && (
        <div className="stats-list">
          {additionalStats.map((stat, index) => (
            <div key={index} className="stat-item">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {progress && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${progress.value}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {progress.total 
              ? `${progress.value}% מתוך ${progress.total}` 
              : `${progress.value}%`}
          </div>
        </div>
      )}
    </div>
  )
}