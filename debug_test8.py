def count_subarrays_debug(nums, left, right):
    count = 0
    n = len(nums)
    valid_subarrays = []
    
    # Check all possible subarrays
    for i in range(n):
        max_val = nums[i]
        for j in range(i, n):
            max_val = max(max_val, nums[j])
            
            # If max is in range [left, right], count this subarray
            if left <= max_val <= right:
                count += 1
                valid_subarrays.append((i, j, nums[i:j+1], max_val))
    
    return count, valid_subarrays

# Test Case 8
nums = [1, 2, 3, 4, 5, 4, 3, 2]
left = 1
right = 5

print(f"nums = {nums}")
print(f"left = {left}, right = {right}")
print(f"\nAll elements: {set(nums)}")
print(f"All elements are in range [{left}, {right}]: {all(left <= x <= right for x in nums)}")

count, valid = count_subarrays_debug(nums, left, right)

print(f"\n{'='*70}")
print(f"Total subarrays with max in [{left}, {right}]: {count}")
print(f"Expected: 20")
print(f"Status: {'✅ CORRECT' if count == 20 else '❌ WRONG'}")
print(f"{'='*70}")

# Since all elements are in [1,5], ALL subarrays should be valid
n = len(nums)
total_possible = n * (n + 1) // 2
print(f"\nTotal possible subarrays: {total_possible}")
print(f"We counted: {count}")

if count != 20:
    print(f"\n🤔 Wait... if all elements are in [1, 5], why isn't the answer {total_possible}?")
    print(f"\nLet me re-check the problem...")
    print(f"\nMaybe the expected output of 20 is wrong?")
    print(f"Or maybe I'm misunderstanding the problem?")
