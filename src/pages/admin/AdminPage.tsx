import React from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '../../components/layout';

const AdminPage: React.FC = () => {
  return (
    <PageLayout title="Admin Panel">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-8 shadow-lg paper-texture"
      >
        <div className="text-center py-12">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, -1, 1, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-6xl mb-4"
          >
            🛡️
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            This is Admin Page
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Administrative dashboard for user management, system settings, 
            and comprehensive reporting. Admin access required.
          </p>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default AdminPage;