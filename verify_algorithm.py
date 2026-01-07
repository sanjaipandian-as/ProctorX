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
                print(f"  Subarray nums[{i}:{j+1}] = {nums[i:j+1]}, max={max_val} ✓")
    
    return count

# Test all cases
test_cases = [
    ([2, 1, 4, 3], 2, 3, 3),
    ([1, 2, 3, 4, 5], 1, 2, 8),
    ([2, 5, 3], 2, 4, 2),
    ([3, 6, 1, 2], 3, 6, 3),
    ([1, 2, 5, 3, 4], 2, 5, 6),
    ([1, 3, 2, 3, 1, 2], 1, 3, 9),
    ([2, 4, 3, 2, 4, 3, 2], 2, 4, 12),
    ([1, 2, 3, 4, 5, 4, 3, 2], 1, 5, 20)
]

for i, (nums, left, right, expected) in enumerate(test_cases, 1):
    print(f"\n{'='*60}")
    print(f"Test Case {i}: nums={nums}, left={left}, right={right}")
    print(f"{'='*60}")
    result = count_subarrays(nums, left, right)
    status = "✅ PASS" if result == expected else "❌ FAIL"
    print(f"\nResult: {result}, Expected: {expected} {status}")
