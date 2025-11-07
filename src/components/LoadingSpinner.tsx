import { Camera } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner = ({ message = "Loading..." }: LoadingSpinnerProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Progress ring */}
          <svg className="absolute inset-0 w-24 h-24 -rotate-90">
            <circle
              className="text-border"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r="44"
              cx="48"
              cy="48"
            />
            <circle
              className="text-primary animate-[spin_3s_linear_infinite]"
              strokeWidth="4"
              strokeDasharray="276"
              strokeDashoffset="69"
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="44"
              cx="48"
              cy="48"
              style={{
                transformOrigin: 'center',
                filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))',
              }}
            />
          </svg>
          
          {/* Camera lens icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera 
              className="text-primary animate-[spin_4s_linear_infinite]" 
              size={40}
              style={{
                filter: 'drop-shadow(0 0 12px hsl(var(--primary) / 0.6))',
              }}
            />
          </div>
          
          {/* Inner rotating circle */}
          <div 
            className="absolute inset-0 flex items-center justify-center animate-[spin_2s_linear_infinite_reverse]"
            style={{ margin: '20px' }}
          >
            <div 
              className="w-12 h-12 rounded-full border-2 border-primary/30"
              style={{
                boxShadow: '0 0 8px hsl(var(--primary) / 0.3)',
              }}
            />
          </div>
        </div>
        
        <p className="text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  );
};
