
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ handleFileUpload }) => {
  return (
    <div className="flex items-center gap-3">
      <Button 
        variant="outline" 
        className="relative"
        onClick={() => document.getElementById('csvFileInput')?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        Cargar archivo CSV
        <input
          id="csvFileInput"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </Button>
      <p className="text-sm text-muted-foreground">
        Formatos aceptados: .csv
      </p>
    </div>
  );
};

export default FileUploader;
