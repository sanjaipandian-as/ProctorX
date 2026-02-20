export default function QuestionPalette({ responses, currentQuestionIndex, onQuestionSelect }) {
    const getQuestionStatus = (response, index) => {
        if (index === currentQuestionIndex) {
            return 'bg-gradient-to-r from-[#FFB343] to-[#FF9F2E] text-white border-orange-400';
        }

        if (response.questionType?.toLowerCase() === 'descriptive') {
            return response.isEvaluated
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'bg-amber-100 text-amber-700 border-amber-300';
        }

        if (response.questionType?.toLowerCase() === 'coding') {
            const passedAll = response.testcases?.every(tc => tc.passed);
            return passedAll
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'bg-red-100 text-red-700 border-red-300';
        }

        return response.isCorrect
            ? 'bg-green-100 text-green-700 border-green-300'
            : 'bg-red-100 text-red-700 border-red-300';
    };

    return (
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-2">
                {responses.map((response, index) => (
                    <button
                        key={index}
                        onClick={() => onQuestionSelect(index)}
                        className={`w-10 h-10 rounded-lg font-semibold text-sm border-2 transition-all hover:scale-110 ${getQuestionStatus(response, index)}`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300"></div>
                    <span className="text-gray-600">Correct / Evaluated</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300"></div>
                    <span className="text-gray-600">Incorrect</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-100 border-2 border-amber-300"></div>
                    <span className="text-gray-600">Pending Review</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-[#FFB343] to-[#FF9F2E]"></div>
                    <span className="text-gray-600">Current</span>
                </div>
            </div>
        </div>
    );
}
