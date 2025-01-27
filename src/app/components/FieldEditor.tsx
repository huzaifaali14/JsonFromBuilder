import React from 'react';
import { Modal, Form, Input, Switch } from 'antd';
import { useDispatch } from 'react-redux';
import { updateSchemaFromTreeData } from '@/lib/feature/schema/schemaSlice';
import { updateUiSchemaFromTreeData } from '@/lib/feature/schema/uiSchemaSlice';
import { updateTreeData } from '@/lib/feature/schema/treeSlice';

interface FieldEditorProps {
  open: boolean;
  onClose: () => void;
  field: {
    key: string;
    title: string;
    type: string;
    required: boolean;
    placeholder?: string;
    description?: string;
    help?: string;
    componentType: string;
  };
  treeData: any[];
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  open,
  onClose,
  field,
  treeData,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const updateSchemas = (values: any) => {
    const updatedTreeData = updateTreeDataField(treeData, field.key, values);
    dispatch(updateTreeData([...updatedTreeData]));
    dispatch(updateSchemaFromTreeData({ treeData: [...updatedTreeData] }));
    dispatch(updateUiSchemaFromTreeData({ treeData: [...updatedTreeData] }));
  };

  const updateTreeDataField = (data: any[], key: string, values: any): any[] => {
    return data.map((node) => {
      if (node.key === key) {
        return {
          ...node,
          title: values.title,
          required: values.required,
          description: values.description,
          help: values.help,
          placeholder: values.placeholder,
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeDataField(node.children, key, values),
        };
      }
      return node;
    });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      updateSchemas(values);
      onClose();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue({
        title: field.title,
        required: field.required,
        placeholder: field.placeholder,
        description: field.description,
        help: field.help,
      });
    }
  }, [open, field, form]);

  return (
    <Modal
      title="Edit Field"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          required: false,
        }}
      >
        <Form.Item
          label="Field Title"
          name="title"
          rules={[{ required: true, message: 'Please enter a title' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Required" name="required" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="Placeholder" name="placeholder">
          <Input />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item label="Help Text" name="help">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FieldEditor;
