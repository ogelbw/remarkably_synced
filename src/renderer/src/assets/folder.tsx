function FolderSVG(props: { id: string }): JSX.Element {
  return (
    <svg
      id={props.id}
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="#e8eaed"
    >
      <path
        id={props.id}
        d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Z"
      />
    </svg>
  )
}

export default FolderSVG
