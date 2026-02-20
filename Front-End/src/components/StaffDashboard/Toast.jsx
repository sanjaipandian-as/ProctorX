import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function Toast({ message, type }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-24 right-4 md:right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border ${type === 'success'
                    ? 'bg-green-50/95 border-green-200 text-green-800'
                    : 'bg-red-50/95 border-red-200 text-red-800'
                }`}
        >
            {type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
                <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">{message}</span>
        </motion.div>
    );
}
