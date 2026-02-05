import { useState, useRef } from 'react';

interface FileUploadProps {
  accept: string;
  maxSize: number; // em MB
  onUpload: (url: string) => void;
  label: string;
  description: string;
  icon: string;
}

export default function FileUpload({ accept, maxSize, onUpload, label, description, icon }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    
    // Validar tipo de arquivo
    const fileType = file.type;
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return fileType.includes(type.replace('*', ''));
    });

    if (!isValidType) {
      setUploadError(`Tipo de arquivo não suportado. Aceitos: ${accept}`);
      return;
    }

    // Validar tamanho
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setUploadError(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Simular upload - em produção, isso seria uma chamada à API
      await simulateUpload(file);
      
      // Para demonstração, vamos usar uma URL local simulada
      const mockUrl = URL.createObjectURL(file);
      onUpload(mockUrl);
      
    } catch (error) {
      setUploadError('Erro ao fazer upload do arquivo. Tente novamente.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const simulateUpload = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      // Simular tempo de upload baseado no tamanho do arquivo
      const uploadTime = Math.min(file.size / (1024 * 1024) * 500, 3000);
      setTimeout(() => {
        resolve(`https://example.com/uploads/${file.name}`);
      }, uploadTime);
    });
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : isUploading
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'pointer-events-none' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Fazendo upload...</p>
            <p className="text-sm text-gray-500 mt-1">Por favor, aguarde</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-4">{icon}</div>
            <p className="text-gray-900 font-medium mb-2">{label}</p>
            <p className="text-sm text-gray-600 mb-4">{description}</p>
            
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Arraste e solte aqui ou clique para selecionar
              </p>
              <p className="text-xs text-gray-400">
                Máximo: {maxSize}MB • Formatos: {accept}
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}
    </div>
  );
}

// Componentes específicos para diferentes tipos de arquivo
export const VideoUpload = ({ onUpload }: { onUpload: (url: string) => void }) => (
  <FileUpload
    accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.ogg"
    maxSize={100}
    onUpload={onUpload}
    label="Upload de Vídeo"
    description="Envie um arquivo de vídeo para este material"
    icon="🎥"
  />
);

export const PDFUpload = ({ onUpload }: { onUpload: (url: string) => void }) => (
  <FileUpload
    accept="application/pdf,.pdf"
    maxSize={10}
    onUpload={onUpload}
    label="Upload de PDF"
    description="Envie um arquivo PDF para este material"
    icon="📄"
  />
);

export const ImageUpload = ({ onUpload }: { onUpload: (url: string) => void }) => (
  <FileUpload
    accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
    maxSize={5}
    onUpload={onUpload}
    label="Upload de Imagem"
    description="Envie uma imagem para este material"
    icon="🖼️"
  />
);