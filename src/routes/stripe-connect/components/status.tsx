import { StatusCell as StatusCell_ } from '../../../components/table/table-cells/common/status-cell';

type StatusCellProps = {
  status: 'pending' | 'active' | 'disabled' | 'not connected';
};

const getStatusColor = (status: string): 'green' | 'orange' | 'red' | 'grey' => {
  switch (status) {
    case 'active':
      return 'green';
    case 'pending':
      return 'orange';
    case 'disabled':
      return 'red';
    case 'not connected':
      return 'red';
    default:
      return 'grey';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active':
      return 'Connected';
    case 'pending':
      return 'Pending';
    case 'disabled':
      return 'Disabled';
    case 'not connected':
      return 'Not connected';
    default:
      return status;
  }
};

export const Status = ({ status }: StatusCellProps) => {
  return (
    <div className="flex h-full w-full items-center overflow-hidden">
      <span className="truncate">
        <StatusCell_ color={getStatusColor(status)}>{getStatusLabel(status)}</StatusCell_>
      </span>
    </div>
  );
};
