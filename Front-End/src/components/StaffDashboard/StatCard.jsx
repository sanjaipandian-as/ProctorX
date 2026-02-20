import { motion } from 'framer-motion';

export default function StatCard({ title, value, subtitle, icon, iconBgColor }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md hover:shadow-xl transition-all group"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-[#FFB343] transition-colors">{value}</h3>
                    <p className="text-xs text-gray-500">{subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${iconBgColor} group-hover:scale-110 transition-transform`}>
                    <div className="text-gray-700">
                        {icon}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
