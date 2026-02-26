'use client';

import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';

export default function RichEditor({ value, onChange }) {
  return (
    <div className="bg-white rounded-lg">
      <SunEditor
        setContents={value || ''}
        onChange={onChange}
        setOptions={{
          height: 260,
          placeholder: 'Write meeting agenda, updates, announcements...',
          buttonList: [
            ['undo', 'redo'],
            ['font', 'fontSize'],
            ['bold', 'italic', 'underline', 'strike'],
            ['fontColor', 'hiliteColor'],
            ['align', 'list'],
            ['link'],
            ['codeView'],
          ],
        }}
      />
    </div>
  );
}
