<script>
  export let selected; // 부모로부터 전달받은 값
</script>

<select bind:value={selected}>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
  <option value="option3">Option 3</option>
</select>

<p>선택된 값: {selected}</p>