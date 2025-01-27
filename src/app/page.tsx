'use client';

import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography, theme } from 'antd';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema } from '@rjsf/utils';
import JsonEditor from './components/JsonEditor';
import { updateSchema } from '@/lib/feature/schema/schemaSlice';
import { updateUiSchema } from '@/lib/feature/schema/uiSchemaSlice';
import { updateTreeFromSchemas } from '@/lib/feature/schema/treeSlice';

const { Title } = Typography;

interface RootState {
  schema: {
    formSchema: {
      type: string;
      title: string;
      properties: Record<string, any>;
      required: string[];
    };
  };
  uiSchema: {
    formUiSchema: Record<string, any>;
  };
}

// Custom theme overrides for the form
const customTheme = {
  ...AntDTheme,
  widgets: {
    ...AntDTheme.widgets,
  },
};


export default function HomePage() {
  const formSchema = useSelector((state: RootState) => state.schema.formSchema);
  const uiSchema = useSelector((state: RootState) => state.uiSchema.formUiSchema);
  const dispatch = useDispatch()
  const { token } = theme.useToken();
  const CustomForm = withTheme(customTheme);

  const extraUiSchema = {
    ...uiSchema,
    'ui:submitButtonOptions': {
      submitText: 'Submit Form',
      props: {
        size: 'large',
        type: 'primary',
        className: 'w-full mt-4',
      },
    },
    'ui:globalOptions': {
      classNames: 'space-y-4',
    },
  };

  const handleSubmit = ({ formData }) => {
    console.log('Form submitted:', formData);
  };

  return (
    <div className='p-[24px] max-w-[1400px] mx-auto'>
      <Title level={2}>Form Builder</Title>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='space-y-6'>
          <Card
            title="Generated JSON Schema"
            className='shadow-sm'
            styles={{
              body: {
                maxHeight: '300px',
                overflow: 'auto',
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
              }
            }}
          >
            <JsonEditor value={formSchema} onChange={(data) => {
              dispatch(updateSchema({ formSchema: data }));
              dispatch(updateTreeFromSchemas({ schema: { ...data }, uiSchema: { ...extraUiSchema } }));
            }} autoSize />
          </Card>

          <Card
            title="Generated UI Schema"
            className='shadow-sm'
            styles={{
              body: {
                maxHeight: '300px',
                overflow: 'auto',
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
              }
            }}
          >
            <JsonEditor value={extraUiSchema} onChange={(data) => {
              dispatch(updateUiSchema({ uiSchema: data }));
              dispatch(updateTreeFromSchemas({ schema: { ...formSchema }, uiSchema: { ...data } }));
            }} autoSize />
          </Card>
        </div>

        <Card
          title="Generated Form"
          className='shadow-sm'
          styles={{
            body: {
              background: token.colorBgContainer,
              borderRadius: token.borderRadiusLG,
            }
          }}
        >
          <CustomForm
            validator={validator}
            schema={formSchema as RJSFSchema}
            uiSchema={extraUiSchema as any}
            onSubmit={handleSubmit}
            className="ant-form-vertical"
            formContext={{
              labelCol: { span: 24 },
              wrapperCol: { span: 24 },
            }}
          />
        </Card>
      </div>
    </div>
  );
}