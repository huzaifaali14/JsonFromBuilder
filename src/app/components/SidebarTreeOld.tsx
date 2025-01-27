import React, { useState } from 'react';
import { Tree, Button, Modal, message, Card, Row, Col, Tooltip } from 'antd';
import { DatabaseOutlined, DownOutlined, EditOutlined } from '@ant-design/icons';
import {
  PlusOutlined,
  FormOutlined,
  NumberOutlined,
  CheckSquareOutlined,
  CalendarOutlined,
  SelectOutlined,
  SlidersFilled,
  SwitcherOutlined,
  UploadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useDispatch, useSelector } from 'react-redux';
import { updateSchemaFromTreeData } from '@/lib/feature/schema/schemaSlice';
import { updateUiSchemaFromTreeData } from '@/lib/feature/schema/uiSchemaSlice';
import FieldEditor from './FieldEditor';
import { treeSelector, updateTreeData } from '@/lib/feature/schema/treeSlice';

interface TreeData extends DataNode {
  key: string;
  title: string;
  children?: TreeData[];
  componentType?: string;
  required?: boolean;
  description?: string;
  help?: string;
  placeholder?: string;
}


const antComponents = [
  { name: 'Input', icon: <FormOutlined />, type: 'input' },
  { name: 'Number Input', icon: <NumberOutlined />, type: 'number-input' },
  { name: 'Select', icon: <SelectOutlined />, type: 'select' },
  { name: 'Checkbox', icon: <CheckSquareOutlined />, type: 'checkbox' },
  { name: 'DatePicker', icon: <CalendarOutlined />, type: 'date-picker' },
  { name: 'Switch', icon: <SwitcherOutlined />, type: 'switch' },
  { name: 'Slider', icon: <SlidersFilled />, type: 'slider' },
  { name: 'Upload', icon: <UploadOutlined />, type: 'upload' },
  { name: 'TextArea', icon: <FileTextOutlined />, type: 'textarea' },
  // { name: 'NestedForm', icon: <DatabaseOutlined />, type: 'nestedForm' },
];


const traverseAndDeleteNode = (tableData, position: number[]) => {
  if (position.length === 1) {
    const itemToRemove = tableData[position[0]];
    tableData.splice(Number(position[0]), 1, { 'title': 'undefined', 'key': 'moved' });
    return { resultantTreeData: tableData, itemToRemove: itemToRemove };
  }
  const item = position.shift();
  const data = tableData?.[Number(item)]?.children;
  const { resultantTreeData, itemToRemove } = traverseAndDeleteNode([...data], position);
  tableData[Number(item)].children = resultantTreeData;
  return { resultantTreeData: tableData, itemToRemove: itemToRemove };
}

const traverseAndSetNode = (tableData, position: number[], dropLocation: number, itemToPlace) => {
  if (position.length === 1) {
    if (dropLocation === -1) {
      tableData.splice(Number(position[0]) - 1, 0, itemToPlace)
    }
    else if (dropLocation === 1) {
      tableData.splice(Number(position[0]) + 1, 0, itemToPlace)
    }
    else if (dropLocation === 0) {
      tableData[Number(position[0])].children = tableData[Number(position[0])]?.children?.length ? [itemToPlace, ...tableData[Number(position[0])]?.children] : [itemToPlace]
    }
    return tableData;
  }

  const item = position.shift();
  const data = tableData?.[Number(item)]?.children;
  tableData[Number(item)].children = traverseAndSetNode(data, position, dropLocation, itemToPlace)
  return tableData
}

const SidebarTree: React.FC = () => {
  const dispatch = useDispatch();
  const treeData = useSelector(treeSelector.treeData)
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<typeof antComponents[0] | null>(null);
  const [editingField, setEditingField] = useState<TreeData | null>(null);

  const handleAddNode = () => {
    setIsModalVisible(true);
  };

  const findNodeByKey = (data: TreeData[], key: string): TreeData | null => {
    for (const node of data) {
      if (node.key === key) return node;
      if (node.children) {
        const found = findNodeByKey(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  const handleEditField = (key: string) => {
    const node = findNodeByKey(treeData, key);
    if (node) {
      setEditingField(node);
    }
  };

  const handleModalOk = () => {
    if (!selectedComponent) {
      message.error('Please select a component');
      return;
    }

    const newKey = `${selectedNode}-${Date.now()}`;
    const newNode: TreeData = {
      title: selectedComponent.name,
      key: newKey,
      componentType: selectedComponent.type,
      required: false,
    };

    const updateTreeDataFn = (list: TreeData[], key: string, children?: TreeData[]): TreeData[] => {
      return list.map((node) => {
        if (node.key === key) {
          return {
            ...node,
            children: children ? [...(node.children || []), ...children] : [...(node.children || []), newNode],
          };
        }
        if (node.children) {
          return {
            ...node,
            children: updateTreeDataFn(node.children, key),
          };
        }
        return node;
      });
    };
    const updatedTreeData = updateTreeDataFn(treeData, selectedNode);
    dispatch(updateTreeData(updatedTreeData));
    updateFormSchemas(updatedTreeData);
    setIsModalVisible(false);
    setSelectedComponent(null);
  };

  const updateFormSchemas = (newTreeData: TreeData[]) => {
    dispatch(updateSchemaFromTreeData({ treeData: newTreeData }));
    dispatch(updateUiSchemaFromTreeData({ treeData: newTreeData }));
  };


  const onDrop = (info) => {
    const { dragNode, node, dropPosition } = info
    const dragNodePosition = dragNode.pos.split('-');
    const dropNodePostition = node.pos.split('-');
    const dropLocation = dropPosition - Number(dropNodePostition[dropNodePostition.length - 1]);
    dragNodePosition.shift()
    dropNodePostition.shift()
    const updatedTreeData = traverseAndDeleteNode(treeData.map((it) => ({ ...it })), dragNodePosition);
    const newTreeData = traverseAndSetNode(updatedTreeData.resultantTreeData, dropNodePostition, dropLocation, updatedTreeData.itemToRemove)

    const clenseTreeData = (d) => {
      return d.map(item => {
        if (item.children?.length) {
          item.children = clenseTreeData(item.children)
          return item;
        }

        if (item.key !== 'moved') {
          return item;
        }
      }).filter(Boolean)
    }
    const tt = clenseTreeData(newTreeData);
    dispatch(updateTreeData([...tt]));
    updateFormSchemas([...tt])
  }

  // const xonDrop: TreeProps['onDrop'] = (info) => {
  //   const dropKey = info.node.key as string;
  //   const dragKey = info.dragNode.key as string;
  //   const dropPos = info.node.pos.split('-');
  //   const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

  //   const loop = (
  //     data: TreeData[],
  //     key: string,
  //     callback: (node: TreeData, i: number, data: TreeData[]) => void,
  //   ) => {
  //     for (let i = 0; i < data.length; i++) {
  //       if (data[i].key === key) {
  //         callback(data[i], i, data);
  //         return;
  //       }
  //       if (data[i].children) {
  //         loop(data[i].children!, key, callback);
  //       }
  //     }
  //   };

  //   const data = [...treeData];
  //   let dragObj: TreeData;

  //   loop(data, dragKey, (item, index, arr) => {
  //     arr.splice(index, 1);
  //     dragObj = item;
  //   });

  //   if (!info.dropToGap) {
  //     loop(data, dropKey, (item) => {
  //       item.children = item.children || [];
  //       item.children.unshift(dragObj);
  //     });
  //   } else if (
  //     ((info.node as any).props.children || []).length > 0 &&
  //     (info.node as any).props.expanded &&
  //     dropPosition === 1
  //   ) {
  //     loop(data, dropKey, (item) => {
  //       item.children = item.children || [];
  //       item.children.unshift(dragObj);
  //     });
  //   } else {
  //     let ar: TreeData[] = [];
  //     let i: number;
  //     loop(data, dropKey, (_item, index, arr) => {
  //       ar = arr;
  //       i = index;
  //     });
  //     if (dropPosition === -1) {
  //       ar.splice(i!, 0, dragObj);
  //     } else {
  //       ar.splice(i! + 1, 0, dragObj);
  //     }
  //   }
  //   setTreeData(data);
  //   updateFormSchemas(data);
  // };

  const renderTreeNodes = (nodes: TreeData[]): any[] => {
    return nodes.map(node => ({
      ...node,
      title: node.componentType ? (
        <div className="flex items-center gap-2">
          <span>{node.title}</span>
          <Tooltip title="Edit field">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleEditField(node.key);
              }}
            />
          </Tooltip>
        </div>
      ) : node.title,
      children: node.children ? renderTreeNodes(node.children) : undefined,
    }));
  };

  return (
    <div className="sidebar-tree">
      <div className="tree-header" style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          className='disabled:bg-white'
          icon={<PlusOutlined />}
          onClick={handleAddNode}
          style={{ marginRight: 8 }}
          disabled={!selectedNode}
        >
          Add Element
        </Button>
      </div>

      <Tree
        showLine
        switcherIcon={<DownOutlined className='text-inherit bg-inherit' />}
        draggable
        defaultExpandAll
        treeData={renderTreeNodes(treeData)}
        onDrop={onDrop}
        allowDrop={(info) => {
          return info.dropPosition !== 0
        }}
        onSelect={(selectedKeys) => {
          setSelectedNode(selectedKeys[0] as string);
        }}
      />

      <Modal
        title={<span className="text-lg font-medium">Select UI Element</span>}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedComponent(null);
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          {antComponents.map((component) => (
            <Card
              key={component.type}
              hoverable
              className={`cursor-pointer ${selectedComponent?.type === component.type ? 'border-blue-500 border-2' : ''
                }`}
              onClick={() => setSelectedComponent(component)}
            >
              <div className="flex flex-col items-center gap-2">
                {component.icon}
                <span className="text-sm">{component.name}</span>
              </div>
            </Card>
          ))}
        </div>
      </Modal>

      {editingField && (
        <FieldEditor
          open={!!editingField}
          onClose={() => setEditingField(null)}
          field={editingField}
          treeData={treeData}
        />
      )}
    </div>
  );
};

export default SidebarTree;
