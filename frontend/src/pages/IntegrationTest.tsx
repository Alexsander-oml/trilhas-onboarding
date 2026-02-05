import { BackendTest } from '../components/BackendTest';

export const IntegrationTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <BackendTest />
      </div>
    </div>
  );
};

export default IntegrationTest;
