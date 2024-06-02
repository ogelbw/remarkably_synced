export function DropDown(props: {
  options: string[]
  selected: string
  onChange: (value: string) => void
}): JSX.Element {
  return (
    <select
      style={{ marginLeft: '20px' }}
      value={props.selected}
      onChange={(e) => {
        props.onChange(e.target.value)
      }}
    >
      {props.options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}
