import { useState } from 'react'
import { useRepoStore } from '../../stores/repoStore'
import { ChevronRight, Folder, FolderOpen, FileText, FileCode, FileJson, File, Circle } from 'lucide-react'
import type { FileTreeNode as TreeNode } from '../../types'

interface Props {
    nodes: TreeNode[]
    depth?: number
}

const fileIcon = (ext?: string) => {
    switch (ext) {
        case '.ts':
        case '.tsx':
        case '.js':
        case '.jsx':
            return <FileCode size={14} color="var(--accent-secondary)" />
        case '.json':
            return <FileJson size={14} color="var(--warning)" />
        case '.md':
        case '.txt':
            return <FileText size={14} color="var(--text-tertiary)" />
        case '.py':
            return <FileCode size={14} color="var(--success)" />
        case '.css':
        case '.scss':
            return <FileCode size={14} color="#e879f9" />
        default:
            return <File size={14} color="var(--text-tertiary)" />
    }
}

export default function FileTree({ nodes, depth = 0 }: Props) {
    return (
        <div className="file-tree">
            {nodes.map((node) => (
                <FileTreeItem key={node.path} node={node} depth={depth} />
            ))}
        </div>
    )
}

function FileTreeItem({ node, depth }: { node: TreeNode; depth: number }) {
    const [open, setOpen] = useState(depth < 1)
    const { selectedFile, selectFile, changedFiles } = useRepoStore()

    const isChanged = !node.is_dir && changedFiles.includes(node.path)

    const handleClick = () => {
        if (node.is_dir) {
            setOpen(!open)
        } else {
            selectFile(node.path)
        }
    }

    // Check if any descendant is changed
    const hasChangedChild = node.is_dir && hasChangedDescendant(node, changedFiles)

    return (
        <>
            <div
                className={`file-tree-node ${selectedFile === node.path ? 'active' : ''} ${isChanged ? 'changed' : ''}`}
                style={{ '--depth': depth } as React.CSSProperties}
                onClick={handleClick}
                role="button"
                tabIndex={0}
            >
                {node.is_dir ? (
                    <>
                        <ChevronRight
                            size={14}
                            className={`file-tree-chevron ${open ? 'open' : ''}`}
                        />
                        {open ? (
                            <FolderOpen size={14} color={hasChangedChild ? 'var(--warning)' : 'var(--accent-secondary)'} />
                        ) : (
                            <Folder size={14} color={hasChangedChild ? 'var(--warning)' : 'var(--text-tertiary)'} />
                        )}
                    </>
                ) : (
                    <>
                        <span style={{ width: 14 }} />
                        {fileIcon(node.extension)}
                    </>
                )}
                <span className="file-tree-name" style={isChanged ? { color: 'var(--warning)' } : undefined}>
                    {node.name}
                </span>
                {isChanged && (
                    <Circle size={6} fill="var(--warning)" color="var(--warning)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                )}
            </div>

            {node.is_dir && open && node.children && (
                <FileTree nodes={node.children} depth={depth + 1} />
            )}
        </>
    )
}

function hasChangedDescendant(node: TreeNode, changedFiles: string[]): boolean {
    if (!node.children) return false
    return node.children.some(
        (child) =>
            changedFiles.includes(child.path) ||
            (child.is_dir && hasChangedDescendant(child, changedFiles))
    )
}
