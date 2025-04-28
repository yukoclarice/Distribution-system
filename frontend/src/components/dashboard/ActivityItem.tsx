type ActivityItemProps = {
  user: string;
  action: string;
  time: string;
}

export function ActivityItem({ user, action, time }: ActivityItemProps) {
  const initials = user.split(' ').map(name => name[0]).join('')
  
  return (
    <div 
      className="flex items-center justify-between py-3.5 px-3 border-b border-border/30 cursor-pointer hover:bg-secondary/40 rounded-xl transition-colors" 
      onClick={() => console.log(`Activity clicked: ${user} ${action}`)}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
          <span className="text-xs font-medium text-primary">{initials}</span>
        </div>
        <div>
          <p className="text-sm">
            <span className="font-medium text-foreground">{user}</span>{' '}
            <span className="text-muted-foreground">{action}</span>
          </p>
        </div>
      </div>
      <span className="text-xs text-muted-foreground/80 bg-secondary/60 py-1 px-2 rounded-full">{time}</span>
    </div>
  )
} 