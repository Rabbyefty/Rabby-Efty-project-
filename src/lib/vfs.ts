import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface VFSNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  data?: Blob;
  mimeType?: string;
  size?: number;
  createdAt: number;
  modifiedAt: number;
}

interface VFSSchema extends DBSchema {
  nodes: {
    key: string;
    value: VFSNode;
    indexes: {
      'by-parent': string | null;
      'by-type': string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<VFSSchema>> | null = null;

export const initVFS = () => {
  if (!dbPromise) {
    dbPromise = openDB<VFSSchema>('iOS_VFS', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('nodes')) {
          const store = db.createObjectStore('nodes', { keyPath: 'id' });
          store.createIndex('by-parent', 'parentId');
          store.createIndex('by-type', 'type');
        }
      },
    });
  }
  return dbPromise;
};

export const getNodesByParent = async (parentId: string | null): Promise<VFSNode[]> => {
  const db = await initVFS();
  return db.getAllFromIndex('nodes', 'by-parent', parentId);
};

export const getAllFiles = async (): Promise<VFSNode[]> => {
  const db = await initVFS();
  return db.getAllFromIndex('nodes', 'by-type', 'file');
};

export const getNode = async (id: string): Promise<VFSNode | undefined> => {
  const db = await initVFS();
  return db.get('nodes', id);
};

export const addNode = async (node: VFSNode): Promise<void> => {
  const db = await initVFS();
  await db.put('nodes', node);
};

export const deleteNode = async (id: string): Promise<void> => {
  const db = await initVFS();
  // Recursively delete children if it's a folder
  const node = await db.get('nodes', id);
  if (node?.type === 'folder') {
    const children = await getNodesByParent(id);
    for (const child of children) {
      await deleteNode(child.id);
    }
  }
  await db.delete('nodes', id);
};

export const renameNode = async (id: string, newName: string): Promise<void> => {
  const db = await initVFS();
  const node = await db.get('nodes', id);
  if (node) {
    node.name = newName;
    node.modifiedAt = Date.now();
    await db.put('nodes', node);
  }
};

export const generateId = () => Math.random().toString(36).substring(2, 15);
