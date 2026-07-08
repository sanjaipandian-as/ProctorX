import React from 'react';

const SkeletonLoader = ({ count = 3 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            height: '110px',
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Shimmer overlay animation */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
              animation: 'shimmer 1.5s infinite',
              transform: 'translateX(-100%)'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ height: '20px', width: '40%', backgroundColor: '#334155', borderRadius: '4px' }} />
            <div style={{ height: '20px', width: '15%', backgroundColor: '#334155', borderRadius: '4px' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <div style={{ height: '14px', width: '25%', backgroundColor: '#334155', borderRadius: '4px' }} />
            <div style={{ height: '14px', width: '20%', backgroundColor: '#334155', borderRadius: '4px' }} />
            <div style={{ height: '14px', width: '15%', backgroundColor: '#334155', borderRadius: '4px' }} />
          </div>

          {/* Inline keyframe animation style */}
          <style>{`
            @keyframes shimmer {
              100% {
                transform: translateX(100%);
              }
            }
          `}</style>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
