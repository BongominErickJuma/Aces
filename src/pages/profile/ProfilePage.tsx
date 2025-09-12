import React from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '../../components/layout';

const ProfilePage: React.FC = () => {
  return (
    <PageLayout title="Profile">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-8 shadow-lg paper-texture"
      >
        <div className="text-center py-12">
          <motion.div
            animate={{
              scale: [1, 1.03, 1],
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-6xl mb-4"
          >
            👤
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            This is Profile Page
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Manage your personal information, update account settings, 
            and view your activity statistics and performance metrics.
          </p>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default ProfilePage;