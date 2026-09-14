import React from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface SortableSectionProps {
  id: string;
  children: (dragHandleProps: React.HTMLAttributes<HTMLButtonElement>) => React.ReactNode;
}

export const SortableSection: React.FC<SortableSectionProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  } as React.HTMLAttributes<HTMLButtonElement>;

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      {children(dragHandleProps)}
    </div>
  );
};

interface DroppableColumnProps {
  id: string;
  items: string[];
  className?: string;
  children: React.ReactNode;
}

export const DroppableColumn: React.FC<DroppableColumnProps> = ({
  id,
  items,
  className,
  children,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={className}
        style={{
          outline: isOver ? "2px dashed #005EAC" : "none",
          outlineOffset: "-2px",
          minHeight: "100px",
        }}
      >
        {children}
        {items.length === 0 && (
          <div className="p-4 border-2 border-dashed border-[#222D2C]/30 bg-[#FFFFFF]/60 text-center font-mono text-xs text-[#5B6360] font-bold uppercase select-none my-2">
            [Empty Column // Drop Section Here]
          </div>
        )}
      </div>
    </SortableContext>
  );
};
