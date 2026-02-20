import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function CircularStat({ label, value, percentage }) {
    return (
        <div className="flex flex-col items-center">
            <div className="w-24 h-24 mb-2">
                <CircularProgressbar
                    value={percentage}
                    text={`${percentage}%`}
                    styles={buildStyles({
                        pathColor: '#FFB343',
                        textColor: '#1F2937',
                        trailColor: '#FEF3C7',
                        textSize: '20px',
                        pathTransitionDuration: 0.5,
                    })}
                />
            </div>
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            <p className="text-xs text-gray-500">{value}</p>
        </div>
    );
}
