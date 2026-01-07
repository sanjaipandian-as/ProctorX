def count_subarrays(nums, left, right):
    def count_with_max_at_most(limit):
        count = 0
        start = 0
        
        for end in range(len(nums)):
            # Move start pointer while current element exceeds limit
            while start <= end and nums[end] > limit:
                start = end + 1
            
            # Count all subarrays ending at 'end' with start in [start, end]
            count += (end - start + 1)
            print(f"  end={end}, nums[end]={nums[end]}, start={start}, count+={end-start+1}, total={count}")
        
        return count
    
    print(f"\nTest: nums={nums}, left={left}, right={right}")
    print(f"\nCounting subarrays with max <= {right}:")
    count_right = count_with_max_at_most(right)
    print(f"Result: {count_right}")
    
    print(f"\nCounting subarrays with max <= {left-1}:")
    count_left = count_with_max_at_most(left - 1)
    print(f"Result: {count_left}")
    
    result = count_right - count_left
    print(f"\nFinal: {count_right} - {count_left} = {result}")
    return result

# Test Case 2
nums = [1, 2, 3, 4, 5]
left = 1
right = 2
result = count_subarrays(nums, left, right)
print(f"\n✅ Answer: {result}")
print(f"Expected: 8")
