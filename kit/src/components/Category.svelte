<script lang="ts">
  import type { Category } from "src/lib/import";
  export let { name, weight, assignments }: Category = {
    name: "New Category",
    weight: 0,
    assignments: [],
  };

  export let updateGrade: () => void;
  export let addAssignment: () => void;
  export let updateAssignments: Function;
</script>

<table style="width: 90%" id="{name}table">
  <tr style="margin-bottom:0.5px">
    <td />
    <td style="text-align:right; font-weight:bold; width:25%">{name}</td>
    <td style="text-align:left; width:25%"
      ><input
        class="inh"
        value={weight * 100}
        type="number"
        on:change={updateGrade}
      /></td
    >
    <td style="text-align:right;" class="{name}grade" />
  </tr>
  <tr>
    <td style="text-align:left; font-weight:bold; width:25%">Assignment</td>
    <td style="text-align:center; font-weight:bold; width:25%">Points</td>
    <td style="text-align:center; font-weight:bold; width:25%">Out of</td>
    <td style="text-align:right; font-weight:bold; width:25%">Score</td>
  </tr>
  {#each assignments as ass}
    <tr>
      <td style="text-align:left; width:25%" class="{ass.name}name"
        ><input value={ass.name} type="text" /></td
      >
      <td style="text-align:center; width:25%"
        ><input
          class="{name}in"
          value={ass.pointsReceived}
          type="number"
          on:change={updateAssignments}
        /></td
      >
      <td style="text-align:center; width:25%"
        ><input
          class="{name}out"
          value={ass.pointsPossible}
          type="number"
          on:change={updateAssignments}
        /></td
      >
      <td style="text-align:right; width:25%" class="{name}percent"
        >{ass.percent}%</td
      >
    </tr>
  {/each}
  <tr>
    <td
      ><button class="{name}button" on:click={addAssignment(name)}
        >New Assignment</button
      ></td
    >
  </tr>
</table>
<br />
