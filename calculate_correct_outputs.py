def count_subarrays(nums, left, right):
    count = 0
    n = len(nums)
    
    # Check all possible subarrays
    for i in range(n):
        max_val = nums[i]
        for j in range(i, n):
            max_val = max(max_val, nums[j])
            
            # If max is in range [left, right], count this subarray
            if left <= max_val <= right:
                count += 1
    
    return count

# All test cases
test_cases = [
    { "id": 1, "nums": [2, 1, 4, 3], "left": 2, "right": 3, "old_expected": 3 },
    { "id": 2, "nums": [1, 2, 3, 4, 5], "left": 1, "right": 2, "old_expected": 8 },
    { "id": 3, "nums": [2, 5, 3], "left": 2, "right": 4, "old_expected": 2 },
    { "id": 4, "nums": [3, 6, 1, 2], "left": 3, "right": 6, "old_expected": 3 },
    { "id": 5, "nums": [1, 2, 5, 3, 4], "left": 2, "right": 5, "old_expected": 6 },
    { "id": 6, "nums": [1, 3, 2, 3, 1, 2], "left": 1, "right": 3, "old_expected": 9 },
    { "id": 7, "nums": [2, 4, 3, 2, 4, 3, 2], "left": 2, "right": 4, "old_expected": 12 },
    { "id": 8, "nums": [1, 2, 3, 4, 5, 4, 3, 2], "left": 1, "right": 5, "old_expected": 20 }
]

print("="*80)
print("CALCULATING CORRECT EXPECTED OUTPUTS")
print("="*80)

for tc in test_cases:
    result = count_subarrays(tc["nums"], tc["left"], tc["right"])
    status = "✅" if result == tc["old_expected"] else "❌"
    
    print(f"\nTest {tc['id']}: nums={tc['nums']}, left={tc['left']}, right={tc['right']}")
    print(f"  Old Expected: {tc['old_expected']}")
    print(f"  Actual Result: {result}")
    print(f"  Status: {status} {'MATCH' if result == tc['old_expected'] else 'MISMATCH'}")

print("\n" + "="*80)
print("CORRECTED TEST CASES FOR CompilerPage.jsx:")
print("="*80)
print("\nconst tests = [")
for tc in test_cases:
    result = count_subarrays(tc["nums"], tc["left"], tc["right"])
    n = len(tc["nums"])
    nums_str = " ".join(map(str, tc["nums"]))
    input_str = f"{n}\\n{tc['left']} {tc['right']}\\n{nums_str}"
    print(f'  {{ id: {tc["id"]}, input: "{input_str}", expected: "{result}" }},')
print("];")
