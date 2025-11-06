const Table = ({ data, columns, keyExtractor, onRowClick, emptyMessage = 'No data available' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-zocc-blue-300">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-zocc-blue-700/30">
            {columns.map((column, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left text-sm font-semibold text-zocc-blue-300 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIdx) => (
            <tr
              key={keyExtractor ? keyExtractor(item) : rowIdx}
              onClick={() => onRowClick?.(item)}
              className={`border-b border-zocc-blue-700/10 hover:bg-zocc-blue-800/30 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((column, colIdx) => (
                <td key={colIdx} className="px-4 py-3 text-sm text-white">
                  {column.render
                    ? column.render(item)
                    : column.key
                    ? item[column.key]
                    : item}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

