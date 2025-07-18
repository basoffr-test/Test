import { Check, Upload, Eye, Zap, Settings } from "lucide-react";

interface WorkflowStepsProps {
  currentStep: number;
}

const WorkflowSteps = ({ currentStep }: WorkflowStepsProps) => {
  const steps = [
    {
      id: 1,
      title: "Token Selectie",
      description: "Kies uw ERC-20 token",
      icon: Settings,
    },
    {
      id: 2,
      title: "CSV Upload",
      description: "Upload ontvangerslijst",
      icon: Upload,
    },
    {
      id: 3,
      title: "Preview",
      description: "Controleer transfers",
      icon: Eye,
    },
    {
      id: 4,
      title: "Uitvoering",
      description: "Start airdrop",
      icon: Zap,
    },
  ];

  const getStepClass = (stepId: number) => {
    if (stepId < currentStep) return "step-completed";
    if (stepId === currentStep) return "step-active";
    return "step-pending";
  };

  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${getStepClass(
                  step.id
                )} relative z-10 animate-bounce-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>

              {/* Step Info */}
              <div className="text-center mt-3 px-2">
                <h3 className={`text-sm font-semibold ${
                  isActive ? "text-primary" : isCompleted ? "text-accent" : "text-muted-foreground"
                }`}>
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  {step.description}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-6 h-0.5 transition-all duration-500 hidden sm:block`}
                  style={{
                    left: `${((index + 1) * 100) / steps.length}%`,
                    width: `${100 / steps.length}%`,
                    marginLeft: "24px",
                    marginRight: "24px",
                    backgroundColor: step.id < currentStep 
                      ? "hsl(var(--accent))" 
                      : "hsl(var(--border))",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowSteps;